// SPDX-License-Identifier: CC0-1.0
#include "skeleton.h"
#include <math.h>

// Angles are degrees, ready for libnds glRotateX().
void skeleton_build_walk_pose(SkeletonPose *pose, float phase, int moving)
{
    const float swing = moving ? sinf(phase) * 24.0f : 0.0f;
    pose->left_leg = swing;
    pose->right_leg = -swing;
    pose->left_arm = -swing;
    pose->right_arm = swing;
}
